# MEDREV — BLOCO G: Calendários Paralelos MEDCOF / Estratégia MED / Custom, com Matching ENAMED, FSRS, Casos e Modo Mentor

> **Executor:** Claude Code / VSCodex  
> **Modelo sugerido:** `gpt-5.3-codex`  
> **Reasoning effort:** `high`  
> **Modo:** agent, com aprovação manual para comandos destrutivos.  
> **Objetivo:** criar uma camada robusta de provedores de cronograma para o usuário escolher entre MEDCOF, Estratégia MED importado pelo usuário e cronograma customizado, mantendo tudo conectado ao ENAMED, FSRS, Modo Mentor, domínio prévio e Raciocínio Clínico.

---

## 0. Contexto do PDF enviado

O usuário forneceu um PDF com cronograma do Estratégia MED Extensivo. O arquivo mostra:

- Interface com abas `Dashboard`, `Cronograma`, `Simulados`, `Agenda`, `Banco`.
- Dropdown/filtro `Cronograma ESTRATÉGIA / Todos`.
- Semanas numeradas e progresso semanal.
- Estrutura por especialidade/tema.
- Cronograma com até **Semana 50**.
- Especialidades como `CARDIOLOGIA`, `CIRURGIA`, `ENDOCRINO`, `GASTRO`, `GINECOLOGIA`, `OBSTETRÍCIA`, `INFECTOLOGIA`, `PEDIATRIA`, `PREVENTIVA`, `NEFROLOGIA`, `NEURO`, `PNEUMO`, `REUMATO`, `HEMATO`, `DERMATO`, `PSIQUIATRIA`, `ORTOPEDIA`, `OTORRINO`, `OFTALMO`.

Exemplos visíveis do cronograma:

```txt
Semana 1:
- CARDIOLOGIA — Hipertensão Arterial Sistêmica (Parte 1): Diagnóstico, Classificação, Avaliação
- CIRURGIA — Trauma - Avaliação Inicial, Vias Aéreas e Trauma Torácico
- GINECOLOGIA — Anatomia e Embriologia do Trato Genital Feminino
- OBSTETRÍCIA — Modificações Fisiológicas da Gestação
- PEDIATRIA — Imunizações
- PREVENTIVA — História do SUS

Semanas seguintes:
- CIRURGIA — Trauma - Choque
- ENDOCRINO — Introdução ao Diabetes Mellitus
- GASTRO — Disfagia, Alterações Estruturais e Distúrbios da Motilidade do Esôfago
- INFECTOLOGIA — Tuberculose
- CIRURGIA — Abdome Agudo Inflamatório - Apendicite Aguda
- OBSTETRÍCIA — Síndromes Hipertensivas da Gestação
- GINECOLOGIA — Rastreamento do Câncer de Colo Uterino
- PEDIATRIA — Bronquiolite
- PREVENTIVA — Sistemas de Informação em Saúde
```

**Regra importante:** não embutir este cronograma como conteúdo público oficial do produto. Ele deve entrar como **cronograma importado pelo usuário** ou como seed local/dev. Isso evita transformar material de plataforma externa em asset público do app.

Na UI, usar:

```txt
Estratégia MED — importado pelo usuário
```

Não usar:

```txt
Cronograma oficial Estratégia MED
```

---

## 1. Tese de produto

O MedRev não é banco de questões. O produto é uma camada complementar de inteligência:

```txt
Calendário-base
→ priorização ENAMED
→ revisão espaçada FSRS
→ domínio prévio
→ casos clínicos
→ análise de erro
→ Modo Mentor
```

O calendário escolhido pelo aluno é um **trilho**, não uma prisão. O Mentor deve respeitar a ordem do cronograma, mas pode sugerir desvio com explicação quando houver motivo forte:

```txt
Seu calendário-base sugere Reumatologia hoje.
Mas você tem revisão vencida em GO e baixa cobertura em tema quente ENAMED.
Sugestão: faça GO primeiro e mantenha Reumatologia como estudo leve.
```

---

## 2. Decisões de produto aprovadas

1. Criar calendário do Estratégia MED **paralelo ao MEDCOF**.
2. Permitir escolha do calendário-base.
3. Manter MEDCOF funcionando.
4. O calendário Estratégia deve se conectar a:
   - FSRS;
   - ENAMED hotness/incidência;
   - Modo Mentor;
   - casos clínicos;
   - “Já domino”;
   - análise de prova;
   - Dashboard/Stats.
5. Estratégia entra preferencialmente como **importação do usuário**.
6. O app deve ter bom senso: seguir o calendário, mas priorizar temas ENAMED quando necessário.
7. Não copiar UX/funcionalidade de banco de questões.
8. Não implementar OCR/PDF pesado no browser agora.
9. Implementar importação por texto/JSON e seed dev opcional.

---

## 3. Regras inegociáveis

Antes de editar:

```bash
git status --short
npm run check:mojibake
```

Durante a edição:

- UTF-8 sem BOM.
- Não introduzir mojibake.
- Não instalar libs novas.
- Não fazer `commit`, `deploy` ou `push`.
- Não remover MEDCOF.
- Não quebrar cronogramas existentes de Residência/Vestibular.
- Não criar dependência de PDF parser no frontend.
- Não embutir cronograma Estratégia como conteúdo público oficial sem marcar como `user_import`.
- Não transformar em banco de questões.
- Lógica pura em `src/core/*`.
- Dados/constantes em `src/constants/*`.
- UI em `src/components/*`.

---

## 4. Arquitetura-alvo

Criar:

```txt
src/constants/calendarProviders.js             [NOVO]
src/constants/estrategiaExtensivoSample.js     [NOVO, sample/dev seed mínimo, não full oficial]
src/core/calendarProvider.js                   [NOVO]
src/core/calendarProvider.test.js              [NOVO]
src/components/CalendarProviderSelector.jsx    [NOVO]
src/components/CalendarImportWizard.jsx        [NOVO]
src/components/CalendarMappingPanel.jsx        [NOVO]
```

Patch:

```txt
src/core/store.js
src/core/mentorAutopilot.js
src/core/enamedIntel.js          [apenas se precisar expor helper de prioridade]
src/core/fsrs.js                 [apenas se precisar adapter MEDCOF]
src/constants/casosClinicos.js   [não mudar conteúdo, só usar helpers existentes]
src/components/CronogramaHub.jsx [se criado no F2]
src/components/Cronograma.jsx
src/components/Dashboard.jsx     [mínimo: exibir provider ativo]
src/components/StatsPanel.jsx    [mínimo: seção de cobertura por provider]
```

Não mexer:

```txt
src/components/RaciocinioClinico.jsx  [exceto CTA por tema, se simples]
src/components/FocusMode.jsx          [F2/mobile]
src/components/Primitives.jsx         [F2/tooltips]
```

---

## 5. Schema unificado de tópico de calendário

Todo tema, vindo de MEDCOF, Estratégia ou custom, deve virar este shape:

```js
{
  id: "estrategia-w08-cirurgia-apendicite",
  provider: "estrategia_extensivo_user",
  providerLabel: "Estratégia MED — importado pelo usuário",
  source: "user_imported_pdf" | "user_pasted_text" | "manual" | "builtin_medcof" | "dev_seed",

  semana: 8,
  ordem: 6,

  areaOriginal: "CIRURGIA",
  areaCanonica: "Cirurgia",
  especialidade: "Cirurgia Geral",

  temaOriginal: "Abdome Agudo Inflamatório - Apendicite Aguda",
  temaNormalizado: "Apendicite Aguda",
  temaMedcofMatch: "Apendicite Aguda",

  tags: ["abdome agudo", "apendicite", "cirurgia"],
  enamedRelevance: "alta", // "alta" | "media" | "baixa" | "desconhecida"
  enamedScore: 0.92,

  hasCasoClinico: true,
  casoClinicoIds: ["apendicite-classica"],

  mappingStatus: "matched" | "partial" | "unmatched" | "manual",
  createdAt: "YYYY-MM-DD"
}
```

Regra:

- `temaOriginal` preserva o texto do cronograma importado.
- `temaNormalizado` é o tema limpo para exibição/inteligência.
- `temaMedcofMatch` liga ao universo MEDCOF/FSRS/casos.
- `areaCanonica` deve ser uma das áreas canônicas do app:
  ```txt
  Clínica Médica | Cirurgia | GO | Pediatria | Preventiva | Outro
  ```

---

## 6. `src/constants/calendarProviders.js`

Criar arquivo:

```js
// src/constants/calendarProviders.js

export const CALENDAR_PROVIDER = {
  MEDCOF: "medcof",
  ESTRATEGIA_EXTENSIVO_USER: "estrategia_extensivo_user",
  CUSTOM: "custom",
};

export const CALENDAR_PROVIDER_LABEL = {
  [CALENDAR_PROVIDER.MEDCOF]: "MEDCOF",
  [CALENDAR_PROVIDER.ESTRATEGIA_EXTENSIVO_USER]: "Estratégia MED — importado pelo usuário",
  [CALENDAR_PROVIDER.CUSTOM]: "Personalizado",
};

export const AREA_ORIGINAL_TO_CANONICA = {
  CARDIOLOGIA: "Clínica Médica",
  ENDOCRINO: "Clínica Médica",
  GASTRO: "Clínica Médica",
  INFECTOLOGIA: "Clínica Médica",
  NEFROLOGIA: "Clínica Médica",
  NEURO: "Clínica Médica",
  PNEUMO: "Clínica Médica",
  REUMATO: "Clínica Médica",
  HEMATO: "Clínica Médica",
  DERMATO: "Clínica Médica",
  PSIQUIATRIA: "Clínica Médica",

  CIRURGIA: "Cirurgia",
  ORTOPEDIA: "Cirurgia",
  OTORRINO: "Cirurgia",
  OFTALMO: "Cirurgia",

  GINECOLOGIA: "GO",
  OBSTETRÍCIA: "GO",

  PEDIATRIA: "Pediatria",
  PREVENTIVA: "Preventiva",
};

export const ESTRATEGIA_AREA_ALIASES = {
  "OBSTETRICIA": "OBSTETRÍCIA",
  "GINECO": "GINECOLOGIA",
  "CARDIO": "CARDIOLOGIA",
  "ENDOCRINOLOGIA": "ENDOCRINO",
  "PNEUMOLOGIA": "PNEUMO",
  "NEUROLOGIA": "NEURO",
};
```

Se o repo já tem normalizadores de área (`normalizeArea`, `getCanonicalArea`), use-os quando possível. Não crie conflito.

---

## 7. `src/core/calendarProvider.js`

### 7.1 Funções obrigatórias

```js
export function normalizeCalendarText(text) {}

export function normalizeProviderArea(areaOriginal) {}

export function getCanonicalAreaFromProviderArea(areaOriginal) {}

export function normalizeTopicTitle(title) {}

export function extractTagsFromTopic(title) {}

export function buildCalendarTopic(raw, options = {}) {}

export function parseEstrategiaText(text, options = {}) {}

export function matchCalendarTopicToMedcof(topic, medcofTopics = []) {}

export function attachCalendarIntelligence(topic, context = {}) {}

export function getProviderTopics(stateLike, provider) {}

export function chooseCalendarProviderTopics({ provider, medcofTopics, importedTopics }) {}

export function getUnmatchedCalendarTopics(topics = []) {}
```

### 7.2 Normalização de texto

Implementar:

```js
export function normalizeCalendarText(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
```

Não usar para exibição final; só para match.

### 7.3 Normalização de título

Casos comuns:

```js
const TOPIC_REWRITE_RULES = [
  [/abdome agudo inflamatorio.*apendicite/i, "Apendicite Aguda"],
  [/abdome agudo inflamatorio.*colecistite/i, "Colecistite Aguda"],
  [/abdome agudo obstrutivo/i, "Abdome Agudo Obstrutivo"],
  [/diabetes mellitus.*complicacoes agudas/i, "Emergências Hiperglicêmicas - CAD e EHH"],
  [/sindromes hipertensivas.*gesta/i, "Síndromes Hipertensivas na Gestação"],
  [/rastreamento.*colo uterino/i, "Rastreamento do Câncer do Colo do Útero"],
  [/bronquiolite/i, "Bronquiolite"],
  [/tuberculose$/i, "Tuberculose"],
  [/hemorragia pos-parto/i, "Hemorragia Pós-Parto"],
  [/pneumonias na infancia/i, "Pneumonias na Infância"],
  [/scassst|sindrome coronaria aguda sem supra/i, "SCASSST - Síndrome Coronária Aguda Sem Supra do Segmento ST"],
  [/iamcsst|infarto agudo.*supradesnivelamento/i, "IAMCSST"],
];
```

Use `normalizeCalendarText` internamente para comparar, mas preserve acentos na string final.

### 7.4 Parser de texto Estratégia

Entrada esperada: texto colado/exportado do PDF.

O PDF pode extrair fora de ordem. Portanto, o parser deve ser tolerante e gerar **preview editável**, não assumir precisão perfeita.

Regras:

- Detectar áreas por linhas uppercase conhecidas.
- Detectar semana por `Semana \d+`.
- Cada linha após uma área e antes da próxima área vira tema.
- Se semana não for detectada com segurança, usar `semana: null` e `mappingStatus: "partial"`.
- Não quebrar se faltar semana.
- Não tentar OCR.

Pseudocódigo:

```js
const AREA_SET = new Set([
  "CARDIOLOGIA", "CIRURGIA", "ENDOCRINO", "GASTRO", "GINECOLOGIA",
  "INFECTOLOGIA", "PEDIATRIA", "OBSTETRÍCIA", "PREVENTIVA", "NEFROLOGIA",
  "NEURO", "PNEUMO", "REUMATO", "HEMATO", "DERMATO", "PSIQUIATRIA",
  "ORTOPEDIA", "OTORRINO", "OFTALMO"
]);

export function parseEstrategiaText(text, options = {}) {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const topics = [];
  let currentWeek = null;
  let currentArea = null;
  let order = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const normalized = normalizeCalendarText(line).toUpperCase();

    const weekMatch = line.match(/Semana\s+(\d+)/i);
    if (weekMatch) {
      currentWeek = Number(weekMatch[1]);
      order = 0;
      continue;
    }

    const upper = line.toUpperCase();
    const area = AREA_SET.has(upper) ? upper : null;
    if (area) {
      currentArea = area;
      continue;
    }

    if (!currentArea) continue;
    if (/^\d+$/.test(line)) continue;
    if (/^\d+%$/.test(line)) continue;
    if (["Dashboard", "Simulados", "Agenda", "Banco", "Cronograma"].includes(line)) continue;

    topics.push(buildCalendarTopic({
      provider: "estrategia_extensivo_user",
      source: options.source || "user_pasted_text",
      semana: currentWeek,
      ordem: ++order,
      areaOriginal: currentArea,
      temaOriginal: line,
    }, options));
  }

  return topics;
}
```

### 7.5 Matching MEDCOF

Implementar scoring simples:

```js
export function matchCalendarTopicToMedcof(topic, medcofTopics = []) {
  const t = normalizeCalendarText(topic.temaNormalizado || topic.temaOriginal);
  let best = null;
  let bestScore = 0;

  for (const med of medcofTopics) {
    const name = typeof med === "string" ? med : med.nome || med.name || med.tema;
    const m = normalizeCalendarText(name);

    let score = 0;
    if (t === m) score = 1;
    else if (t.includes(m) || m.includes(t)) score = 0.85;
    else {
      const wordsT = new Set(t.split(" ").filter((w) => w.length > 3));
      const wordsM = new Set(m.split(" ").filter((w) => w.length > 3));
      const overlap = [...wordsT].filter((w) => wordsM.has(w)).length;
      const denom = Math.max(1, Math.min(wordsT.size, wordsM.size));
      score = overlap / denom;
    }

    if (score > bestScore) {
      bestScore = score;
      best = name;
    }
  }

  if (bestScore >= 0.75) return { status: "matched", temaMedcofMatch: best, score: bestScore };
  if (bestScore >= 0.45) return { status: "partial", temaMedcofMatch: best, score: bestScore };
  return { status: "unmatched", temaMedcofMatch: null, score: bestScore };
}
```

### 7.6 Inteligência do tópico

`attachCalendarIntelligence(topic, context)` deve anexar:

- `enamedScore`;
- `enamedRelevance`;
- `hasCasoClinico`;
- `casoClinicoIds`;
- `isHotTopic`;
- `mentorPriorityHint`.

Contexto:

```js
{
  enamedHotness,
  casosClinicos,
  medcofTopics,
  provasStats,
  coverageByArea,
}
```

Regras:

- Tema com caso clínico seed ganha bônus leve.
- Tema de alta incidência ENAMED ganha bônus.
- Tema sem match fica usável, mas com `mappingStatus: "unmatched"`.

---

## 8. Sample/dev seed do Estratégia

Criar `src/constants/estrategiaExtensivoSample.js`.

Não embutir o cronograma completo como asset público. Criar apenas sample mínimo para teste e desenvolvimento, marcado como `dev_seed`.

```js
// src/constants/estrategiaExtensivoSample.js
// Amostra DEV baseada em cronograma importado pelo usuário.
// Não tratar como conteúdo oficial público da plataforma Estratégia MED.

export const ESTRATEGIA_EXTENSIVO_SAMPLE = [
  {
    semana: 1,
    ordem: 1,
    areaOriginal: "CARDIOLOGIA",
    temaOriginal: "Hipertensão Arterial Sistêmica (Parte 1): Diagnóstico, Classificação, Avaliação",
  },
  {
    semana: 1,
    ordem: 2,
    areaOriginal: "CIRURGIA",
    temaOriginal: "Trauma - Avaliação Inicial, Vias Aéreas e Trauma Torácico",
  },
  {
    semana: 1,
    ordem: 3,
    areaOriginal: "GINECOLOGIA",
    temaOriginal: "Anatomia e Embriologia do Trato Genital Feminino",
  },
  {
    semana: 1,
    ordem: 4,
    areaOriginal: "OBSTETRÍCIA",
    temaOriginal: "Modificações Fisiológicas da Gestação",
  },
  {
    semana: 1,
    ordem: 5,
    areaOriginal: "PEDIATRIA",
    temaOriginal: "Imunizações",
  },
  {
    semana: 1,
    ordem: 6,
    areaOriginal: "PREVENTIVA",
    temaOriginal: "História do SUS",
  },
  {
    semana: 8,
    ordem: 1,
    areaOriginal: "CIRURGIA",
    temaOriginal: "Abdome Agudo Inflamatório - Apendicite Aguda",
  },
  {
    semana: 16,
    ordem: 1,
    areaOriginal: "PEDIATRIA",
    temaOriginal: "Bronquiolite",
  },
  {
    semana: 17,
    ordem: 1,
    areaOriginal: "OBSTETRÍCIA",
    temaOriginal: "Hemorragia Pós-Parto",
  },
  {
    semana: 32,
    ordem: 1,
    areaOriginal: "OBSTETRÍCIA",
    temaOriginal: "Síndromes Hipertensivas da Gestação",
  },
  {
    semana: 34,
    ordem: 1,
    areaOriginal: "GINECOLOGIA",
    temaOriginal: "Rastreamento do Câncer de Colo Uterino",
  },
  {
    semana: 35,
    ordem: 1,
    areaOriginal: "OBSTETRÍCIA",
    temaOriginal: "Diabetes Mellitus na Gestação",
  },
];
```

Depois transformar com `buildCalendarTopic`.

Se o usuário quiser usar o cronograma completo, deve importar texto/JSON pelo wizard. Não precisa hardcodar tudo agora.

---

## 9. Store

Adicionar em `meta`:

```js
calendarProvider: {
  activeByPlat: {
    res: "medcof",
    vest: "custom"
  },
  imports: {
    estrategia_extensivo_user: {
      id: null,
      label: "Estratégia MED — importado pelo usuário",
      source: null,
      importedAt: null,
      topics: [],
      mappingOverrides: {}
    }
  }
}
```

Se o store já tem `meta`, preservar todos os campos anteriores.

Actions:

```js
setCalendarProvider(platKey, provider)

importCalendarProviderTopics(provider, topics, options)

clearCalendarProviderImport(provider)

setCalendarTopicMapping(provider, topicId, patch)

applyCalendarProviderToCronograma(platKey, provider, options)
```

Regras:

- Trocar provider **não apaga progresso**.
- Trocar provider **não limpa FSRS**.
- Trocar provider altera apenas a fonte de sugestões/ordem do cronograma.
- Importar Estratégia salva tópicos normalizados.
- Mapeamento manual salva em `mappingOverrides`.

---

## 10. UI — `CalendarProviderSelector.jsx`

Componente simples:

```jsx
<CalendarProviderSelector plat={plat} />
```

Exibir:

```txt
Calendário-base
[MEDCOF ▼]
```

Opções:

```txt
MEDCOF
Estratégia MED — importado pelo usuário
Personalizado
```

Ao escolher Estratégia sem importação:

```txt
Você ainda não importou um cronograma Estratégia MED.
[Importar agora]
[Usar amostra de desenvolvimento]
```

Ao trocar provider:

```txt
Suas revisões e progresso serão preservados. A ordem sugerida de temas pode mudar.
```

Botões:

```txt
Confirmar troca
Cancelar
```

---

## 11. UI — `CalendarImportWizard.jsx`

### 11.1 Objetivo

Permitir importar cronograma externo sem PDF parser pesado no frontend.

Tabs:

```txt
Colar texto | Colar JSON | Usar amostra
```

### 11.2 Colar texto

Textarea grande:

```txt
Cole aqui o texto exportado/copiadodo seu cronograma.
```

Botão:

```txt
Pré-visualizar importação
```

Parser chama:

```js
parseEstrategiaText(text)
```

### 11.3 Preview

Tabela:

```txt
Semana | Área original | Área canônica | Tema | Match MEDCOF | Status
```

Badges:

- `match`
- `parcial`
- `sem match`

Ações:

- Editar tema
- Alterar semana
- Alterar match MEDCOF
- Ignorar item

### 11.4 Confirmar importação

Botão:

```txt
Salvar cronograma importado
```

Action:

```js
importCalendarProviderTopics(CALENDAR_PROVIDER.ESTRATEGIA_EXTENSIVO_USER, previewTopics, {
  source: "user_pasted_text"
})
```

### 11.5 Usar amostra

Para dev/teste:

```txt
Usar amostra de desenvolvimento
```

Deve importar `ESTRATEGIA_EXTENSIVO_SAMPLE` e marcar `source: "dev_seed"`.

---

## 12. UI — `CalendarMappingPanel.jsx`

Mostrar temas sem match:

```txt
Mapeamento pendente
12 temas não foram ligados ao MEDCOF.

[tema original] → [select tema MEDCOF] [Salvar]
```

Regras:

- Tema sem match ainda pode ser estudado.
- Mas ENAMED/casos/FSRS funcionam melhor com match.
- Não bloquear o usuário.

---

## 13. CronogramaHub / Cronograma

Integrar o selector no topo da aba Cronograma:

```txt
Cronograma

Calendário-base: [MEDCOF ▼]

[Catálogo] [Grade Semanal] [Mapeamento]
```

Se provider ativo = MEDCOF:

- mostrar catálogo MEDCOF atual.

Se provider ativo = Estratégia:

- mostrar temas importados por semana;
- permitir filtros:
  - semana;
  - área canônica;
  - especialidade original;
  - status;
  - mapping status.

Cada tema deve manter ações existentes:

```txt
Estudar
Já domino
Treinar caso clínico
Ver ENAMED
```

Regras:

- `Já domino` só em tema não iniciado.
- `Treinar caso clínico` se houver `casoClinicoIds`.
- `Ver ENAMED` mostra porque o Mentor considera relevante.
- Não remover “Novo tema”.

---

## 14. Integração com Mentor Autopilot

Patch em `src/core/mentorAutopilot.js`.

O Mentor deve receber provider ativo:

```js
context.calendarProvider
context.providerTopics
```

Ao escolher tema novo:

```js
chooseNewTopicCandidate(context)
```

deve usar:

```txt
1. provider ativo como trilho
2. prioridade ENAMED
3. baixa cobertura
4. carga futura
5. se tem caso clínico
6. semana atual/importada
```

Regra de bom senso:

```txt
Seguir calendário-base como trilho.
Reordenar apenas se ganho de prioridade for grande.
```

Implementação sugerida:

```js
const PROVIDER_ORDER_WEIGHT = 0.35;
const ENAMED_WEIGHT = 0.35;
const COVERAGE_WEIGHT = 0.15;
const CASE_WEIGHT = 0.10;
const URGENCY_WEIGHT = 0.05;
```

Se tema do provider tem prioridade muito baixa, mas o ENAMED aponta gargalo forte, o Mentor pode sugerir:

```txt
Ação principal: revisar tema ENAMED crítico.
Ação secundária: manter tema da semana do calendário.
```

---

## 15. Integração com ENAMED

`attachCalendarIntelligence` deve usar `ENAMED_HOTNESS`, `HOTNESS_KEYWORDS` ou helpers existentes.

Mapeamento básico:

- GO:
  - Síndromes Hipertensivas, Pré-Natal, Sangramento, Parto, Diabetes na gestação → alta.
- Cirurgia:
  - Abdome agudo, Trauma, Apendicite, Colecistite, Obstrução → alta.
- Clínica:
  - SCA, HAS, IC, DM, DRC, Pneumonia, Tuberculose → alta/média.
- Pediatria:
  - Imunizações, Bronquiolite, Diarreia, Neonatologia, Pneumonia → alta.
- Preventiva:
  - SUS, APS, epidemiologia, indicadores, sistemas de informação → alta.

Não exagerar precisão. O score é heurístico.

---

## 16. Integração com casos clínicos

Usar helpers de `casosClinicos.js`:

```js
getCasosClinicosPorTemaMedcof(topic.temaMedcofMatch || topic.temaNormalizado)
```

Se houver casos:

```js
hasCasoClinico: true
casoClinicoIds: [...]
```

Na UI:

```txt
Caso clínico disponível
```

Botão:

```txt
Treinar caso
```

Se não houver, não mostrar.

---

## 17. Testes obrigatórios

Criar `src/core/calendarProvider.test.js`.

Cobrir:

1. Normaliza área original para área canônica.
2. Parseia texto simples do Estratégia.
3. Ignora linhas de navegação (`Dashboard`, `Simulados`, etc.).
4. Detecta semana.
5. Cria tópico com provider correto.
6. Reescreve tema Estratégia para tema normalizado.
7. Match exato com MEDCOF.
8. Match parcial com MEDCOF.
9. Tema sem match fica `unmatched`.
10. `attachCalendarIntelligence` marca caso clínico quando existe.
11. Troca de provider não apaga progresso (teste no store se viável).

Exemplo de texto para teste:

```txt
Semana 8
CARDIOLOGIA
Insuficiência Cardíaca (Parte 2): Tratamento
CIRURGIA
Abdome Agudo Inflamatório - Apendicite Aguda
GINECOLOGIA
Pólipos Uterinos
Dashboard
Simulados
```

---

## 18. Teste manual

Validar:

1. Entrar em Cronograma.
2. Ver selector `Calendário-base`.
3. Trocar para Estratégia sem importação.
4. Ver CTA de importação.
5. Usar amostra de desenvolvimento.
6. Ver tópicos por semana.
7. Conferir mapeamento:
   - Apendicite → Apendicite Aguda.
   - Síndromes Hipertensivas da Gestação → Síndromes Hipertensivas na Gestação.
   - Bronquiolite → Bronquiolite.
8. Ver temas sem match no painel de mapeamento.
9. Mudar um match manualmente.
10. Confirmar persistência.
11. Voltar para MEDCOF.
12. Confirmar que progresso/revisões não sumiram.
13. Ativar Modo Mentor.
14. Confirmar que tema novo pode vir do provider ativo.
15. Confirmar que prioridade ENAMED influencia recomendação.
16. Confirmar que `Já domino` segue funcionando.
17. Confirmar que caso clínico aparece quando houver match.

---

## 19. Comandos finais

```bash
npm run check:mojibake
npm test -- --watchAll=false
npm run build
git status --short
```

Não rodar:

```bash
git commit
firebase deploy
git push
```

---

## 20. Critérios de aceite

Bloco G aprovado se:

- Existe camada de provedores de calendário.
- MEDCOF continua funcionando.
- Estratégia MED aparece como opção importada pelo usuário.
- Há wizard de importação por texto/JSON/amostra.
- Temas importados são normalizados.
- Áreas originais viram áreas canônicas.
- Matching com MEDCOF funciona.
- Temas sem match ficam visíveis para correção.
- Modo Mentor usa provider ativo para sugerir tema novo.
- ENAMED influencia prioridade com bom senso.
- Casos clínicos aparecem quando há match.
- “Já domino” continua funcionando.
- Trocar provider não apaga progresso.
- Build passa.

---

## 21. Nota final ao executor

Este bloco não é para copiar a plataforma de origem. É para usar um cronograma do aluno como **input operacional** do MedRev.

O valor do MedRev está em:

```txt
Eu posso seguir MEDCOF ou Estratégia.
Mas o app me diz o que importa hoje,
como revisar,
quando reencontrar,
quando validar domínio prévio,
e quando transformar tema em caso clínico.
```

Isso é complementar. Isso é produto.
