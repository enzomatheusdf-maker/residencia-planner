# MEDREV — BLOCO B: ENAMED Intel + Estatísticas com função prática

> **Modelo recomendado:** `gpt-5.3-codex`  
> **Reasoning effort:** `high`  
> **Modo:** Agent com aprovação manual para alterações amplas.  
> **Escopo:** transformar dados ENAMED em decisão visível. Não reescrever Dashboard inteiro, não implementar Illness Script, não mexer no banco de casos clínicos ainda.

---

## 0. Contexto obrigatório para o agente executor

Você está no repositório `Bro/`, app React CRA + Zustand + Tailwind + Firebase.

O Bloco A reorganizou ou irá reorganizar o Dashboard como **Comando do Dia**. Este Bloco B deve fazer a camada de inteligência ENAMED funcionar de forma prática, principalmente na aba **Estatísticas** e, se seguro, em um slot compacto no Dashboard.

Problema atual:

- `src/constants/enamedIncidencia.js` contém `ENAMED_BLUEPRINT`, `ENAMED_HOTNESS`, `MACRO_PESO_ENAMED`, mas isso quase não vira decisão para o aluno.
- `src/constants/provaStats.js` tem dados ricos, mas a UI não transforma esses dados em “o que focar agora”.
- `getReadinessData()` em `src/core/readiness.js` calcula `priorityList`, mas o mapa ENAMED fica fraco/incompleto e pouco visível.
- A aba Estatísticas mostra desempenho, consistência e carga, mas ainda não responde bem: **qual área do ENAMED está derrubando meu preparo e por quê?**

Decisão de produto:

- Dashboard continua sendo **Comando do Dia**.
- Estatísticas vira a área de performance profunda.
- “Prontidão” não deve ser reforçada como nome novo. Use **Preparo estimado** ou **Preparo ENAMED** em rótulos novos.
- True Retention continua aparecendo como **coletando** quando não houver dados.
- ENAMED precisa virar uma camada acionável: **gargalo, cobertura, retenção, hot topics e CTA para foco**.

Fatos oficiais atualizados que devem orientar o patch:

- O Inep publicou o Edital nº 71 do ENAMED 2026 em 29/05/2026.
- As inscrições serão de 15 a 29 de junho de 2026.
- A aplicação ocorrerá em 13 de setembro de 2026.
- O exame é obrigatório para concluintes habilitados e também para estudantes do 4º ano inscritos pelas instituições.
- Graduados podem fazer voluntariamente para usar resultado no ENARE.
- Para ENARE, será considerada a maior nota válida em escala de proficiência pela TRI; a nota do ENAMED tem validade de três anos, exceto para estudantes do 4º ano.

Observação importante: o app trabalha com macroáreas RES: `Clínica Médica`, `Cirurgia`, `GO`, `Pediatria`, `Preventiva`. Para fins de produto, trate MFC/Saúde Coletiva dentro de `Preventiva` e Saúde Mental como transversal ou subtópico mapeável. Não quebre a arquitetura macro de 5 áreas.

---

## 1. Regras inegociáveis

1. **UTF-8 sem BOM** em todos os arquivos.
2. Não introduzir mojibake. Rodar `npm run check:mojibake` ao final.
3. Não usar PowerShell 5.1 para gerar arquivos com acentos. Ambiente já deve estar em PowerShell 7 ou Git Bash.
4. Não instalar libs novas. Sem Recharts/D3. Use SVG/Tailwind/lucide-react.
5. Lógica pura em `src/core/*`; UI em `src/components/*`.
6. Não mudar formato persistido de dados sem migração explícita.
7. Não fazer deploy, commit ou push neste bloco. Isso fica no Bloco G.
8. Não trocar toda a UI de Estatísticas: adicionar o mapa ENAMED e reorganizar apenas o necessário.
9. Preservar compatibilidade com vestibular (`plat === "vest"`). O mapa ENAMED só renderiza para `plat === "res"`.
10. Não reintroduzir o rótulo visual “Prontidão” em novos cards. Use “Preparo”. Campos internos existentes podem permanecer se mudar for arriscado.

---

## 2. Objetivo de implementação

Ao final deste bloco, o usuário deve conseguir abrir **Estatísticas** e entender:

1. Qual é o **gargalo ENAMED** atual.
2. Se o gargalo vem de **baixa cobertura**, **baixa retenção**, ou ambos.
3. Quais subtópicos de alta incidência merecem foco.
4. Qual ação tomar: abrir cronograma/foco naquela área.
5. Qual é o **Preparo ENAMED estimado**, sem fingir precisão quando há poucos dados.

Arquivos-alvo:

```txt
src/core/enamedIntel.js              [NOVO]
src/core/enamedIntel.test.js         [NOVO]
src/constants/provaStats.js          [PATCH]
src/core/store.js                    [PATCH]
src/core/readiness.js                [PATCH]
src/components/EnamedMapa.jsx        [NOVO]
src/components/StatsPanel.jsx        [PATCH]
src/components/Dashboard.jsx         [PATCH LEVE, SOMENTE SE SEGURO]
src/App.js                           [PATCH se StatsPanel precisar receber setView]
```

---

## 3. Pré-flight obrigatório

Execute:

```bash
git status --short
node -v
npm -v
npm run check:mojibake
npm test -- --watchAll=false
```

Se houver falha pré-existente, registre no relatório final antes de mexer. Não esconda falhas.

Procure os pontos atuais:

```bash
grep -R "dataProva" -n src/core/store.js
grep -R "getReadinessData" -n src/components src/core
grep -R "ENAMED" -n src/constants src/core src/components | head -80
```

---

## 4. PATCH 1 — Atualizar fatos do ENAMED em `src/constants/provaStats.js`

Localize `PROVA_STATS_RES.ENAMED`.

Ajuste os campos sem mudar a estrutura geral:

```js
ano: "2026 (2ª edição; prova em 13/09/2026)",
fonte: "INEP/MEC; Edital INEP nº 71/2026; Portarias MEC/INEP 330, 359, 413 e 478/2025; ENARE/HU Brasil; atualizado em 29/05/2026",
perfil: {
  fase: "Fase única objetiva: 100 questões. Macroplanejamento do app em 5 áreas RES; MFC/Saúde Coletiva entram em Preventiva e Saúde Mental é transversal.",
  questoes: 100,
  areas: ["Clínica Médica", "Cirurgia", "GO", "Pediatria", "Preventiva"],
  vagasTotais: null,
  concorrenciaGeral: "Nota pode ser usada no ENARE acesso direto; escala de proficiência por TRI; maior nota válida dentro da janela regulamentar."
},
mudancas: "2025: 1ª edição. 2026: prova em 13/09; participação obrigatória de concluintes habilitados e estudantes do 4º ano inscritos pela instituição; graduados podem realizar voluntariamente para ENARE; classificação considera escala de proficiência por TRI; validade de três anos, exceto 4º ano.",
estilo: "Competências por DCNs, situações-problema e integração clínico-epidemiológica. Para planejamento do app, usar macroáreas RES e tratar Preventiva como eixo APS/MFC/SUS/Saúde Coletiva.",
```

Não invente nota de corte nacional. Mantenha `notasCorte` como `null` quando não houver dado oficial.

Se houver campos já melhores no arquivo, preserve-os e ajuste só o desatualizado.

---

## 5. PATCH 2 — Corrigir data padrão da prova no Zustand

Em `src/core/store.js`, há `dataProva: "2026-10-25"` no estado inicial e no reset. Troque ambos para:

```js
dataProva: "2026-09-13"
```

Adicione migração no merge de `persisted.meta`, perto do trecho onde já há algo parecido com:

```js
meta: {
  ...initial.meta,
  ...(persisted.meta || {}),
  modulos: { ...initial.meta.modulos, ...(persisted.meta.modulos || {}) },
}
```

Faça uma migração exata para não sobrescrever escolhas reais do usuário:

```js
const migratedMeta = { ...(persisted.meta || {}) };
if (migratedMeta.dataProva === "2026-10-25") {
  migratedMeta.dataProva = "2026-09-13";
}
```

Depois use `migratedMeta` no merge. Se a estrutura do store for diferente, adapte, mas preserve a regra: só trocar a data velha se ela for exatamente `2026-10-25`.

---

## 6. PATCH 3 — Criar `src/core/enamedIntel.js`

Crie o arquivo abaixo. Ele deve ser puro, sem React e sem Zustand.

```js
// src/core/enamedIntel.js
// Selectors puros para transformar dados ENAMED em decisão de estudo.
// Não usa React, Zustand ou efeitos colaterais.

import {
  ENAMED_BLUEPRINT,
  ENAMED_HOTNESS,
  MACRO_PESO_ENAMED,
} from "../constants/enamedIncidencia";
import { STEPS } from "./fsrs";
import { findHotnessSubarea } from "./provasStats";

export const AREAS_ENAMED = ["Clínica Médica", "Cirurgia", "GO", "Pediatria", "Preventiva"];

const AREA_ALIASES = {
  "clinica medica": "Clínica Médica",
  "clinica": "Clínica Médica",
  "clínica médica": "Clínica Médica",
  "clínica": "Clínica Médica",
  "cirurgia": "Cirurgia",
  "cirurgia geral": "Cirurgia",
  "go": "GO",
  "ginecologia": "GO",
  "obstetricia": "GO",
  "obstetrícia": "GO",
  "ginecologia e obstetricia": "GO",
  "ginecologia e obstetrícia": "GO",
  "pediatria": "Pediatria",
  "preventiva": "Preventiva",
  "preventiva mfc": "Preventiva",
  "mfc": "Preventiva",
  "medicina de familia": "Preventiva",
  "medicina de família": "Preventiva",
  "saude coletiva": "Preventiva",
  "saúde coletiva": "Preventiva",
  "sus": "Preventiva",
};

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function canonicalArea(value) {
  const normalized = normalizeText(value);
  if (AREA_ALIASES[normalized]) return AREA_ALIASES[normalized];
  return AREAS_ENAMED.find((area) => normalizeText(area) === normalized) || "Outro";
}

export function matchArea(esp, area) {
  return canonicalArea(esp) === canonicalArea(area);
}

function getStepLogs(tema) {
  return STEPS
    .map((step) => tema?.rev?.[step.key])
    .filter((rev) => rev && rev.done);
}

function getAccuracyFromTema(tema) {
  const logs = getStepLogs(tema).filter((rev) => typeof rev.acerto === "number");
  if (!logs.length) return null;
  const avg = logs.reduce((sum, rev) => sum + rev.acerto, 0) / logs.length;
  return Math.round(avg * 100);
}

function getAreaRetention(temas) {
  const values = temas
    .map(getAccuracyFromTema)
    .filter((value) => typeof value === "number");
  if (!values.length) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function getTemaLabel(tema) {
  return tema?.subarea || tema?.subArea || tema?.tema || tema?.nome || tema?.title || "";
}

export function topHotness(area, n = 4) {
  const canonical = canonicalArea(area);
  const hotness = ENAMED_HOTNESS[canonical];
  if (!hotness) return [];
  return Object.entries(hotness)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([subarea, peso]) => ({
      area: canonical,
      subarea,
      peso,
      pct: Math.round(peso * 100),
    }));
}

function getHotTopicsCobertos(area, temasDaArea) {
  const vistos = new Map();
  temasDaArea.forEach((tema) => {
    const label = getTemaLabel(tema);
    const match = findHotnessSubarea(area, label);
    if (match?.subarea && !vistos.has(match.subarea)) {
      vistos.set(match.subarea, {
        subarea: match.subarea,
        peso: match.peso,
        pct: Math.round(match.peso * 100),
        match: match.match,
      });
    }
  });
  return [...vistos.values()].sort((a, b) => b.peso - a.peso);
}

function getHotTopicsPendentes(area, temasDaArea) {
  const cobertos = new Set(getHotTopicsCobertos(area, temasDaArea).map((item) => item.subarea));
  return topHotness(area, 8)
    .filter((item) => !cobertos.has(item.subarea))
    .slice(0, 4);
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function classifyArea({ cobertura, retencao, gap }) {
  if (retencao == null && cobertura === 0) return "sem_dados";
  if (gap >= 75) return "critica";
  if (gap >= 45) return "atencao";
  return "ok";
}

function reasonForArea({ cobertura, retencao }) {
  if (retencao == null && cobertura === 0) return "sem dados: comece por um tema quente da área";
  if (retencao == null) return "sem retenção mensurável: faltam revisões concluídas";
  if (cobertura < 35 && retencao < 70) return "baixa cobertura e baixa retenção";
  if (cobertura < 35) return "baixa cobertura";
  if (retencao < 70) return "baixa retenção";
  return "manutenção";
}

export function getEnamedIntel(temas = []) {
  const listaRaw = AREAS_ENAMED.map((area) => {
    const temasDaArea = temas.filter((tema) => matchArea(tema?.esp, area));
    const iniciados = temasDaArea.filter((tema) => !tema?.unstarted);
    const retencao = getAreaRetention(iniciados);
    const cobertura = temasDaArea.length
      ? Math.round((iniciados.length / temasDaArea.length) * 100)
      : 0;

    const pesoBlueprint = ENAMED_BLUEPRINT[area] ?? 0.20;
    const ajuste = MACRO_PESO_ENAMED[area] ?? 1.0;
    const pesoProva = pesoBlueprint * ajuste;

    // Se não há retenção, use cobertura parcial como proxy fraco de domínio.
    // Isso evita falso 100% e mantém a área sem dados como prioridade real.
    const dominioRetencao = retencao != null ? retencao / 100 : 0;
    const dominioCobertura = cobertura / 100;
    const dominio = clamp01((0.70 * dominioRetencao) + (0.30 * dominioCobertura));
    const gapRaw = pesoProva * (1 - dominio);

    const hotTopicsCobertos = getHotTopicsCobertos(area, iniciados);
    const hotTopicsPendentes = getHotTopicsPendentes(area, iniciados);

    return {
      area,
      total: temasDaArea.length,
      iniciados: iniciados.length,
      cobertura,
      retencao,
      pesoBlueprint,
      ajuste,
      pesoProva,
      dominio: Math.round(dominio * 100),
      gapRaw,
      hotTopics: topHotness(area, 4),
      hotTopicsCobertos,
      hotTopicsPendentes,
    };
  });

  const maxGap = Math.max(...listaRaw.map((item) => item.gapRaw), 0.0001);
  const lista = listaRaw
    .map((item) => {
      const gap = Math.round((item.gapRaw / maxGap) * 100);
      return {
        ...item,
        gap,
        status: classifyArea({ ...item, gap }),
        motivo: reasonForArea(item),
      };
    })
    .sort((a, b) => b.gap - a.gap);

  const gargalo = lista[0] || null;
  const areas = Object.fromEntries(lista.map((item) => [item.area, item]));
  const comDados = lista.filter((item) => item.retencao != null || item.cobertura > 0);
  const coberturaGlobal = lista.length
    ? Math.round(lista.reduce((sum, item) => sum + item.cobertura, 0) / lista.length)
    : 0;

  return {
    lista,
    areas,
    gargalo,
    coberturaGlobal,
    temDados: comDados.length > 0,
  };
}

export function calcPreparoEnamed(temas = []) {
  const { lista } = getEnamedIntel(temas);
  const comDado = lista.filter((item) => item.retencao != null || item.cobertura > 0);
  if (!comDado.length) return null;

  const pesoTotal = comDado.reduce((sum, item) => sum + item.pesoProva, 0) || 1;
  const score = comDado.reduce((sum, item) => {
    const retencao = item.retencao != null ? item.retencao : 0;
    const fatorCobertura = 0.50 + 0.50 * (item.cobertura / 100);
    return sum + item.pesoProva * retencao * fatorCobertura;
  }, 0) / pesoTotal;

  return Math.round(score);
}

// Alias temporário se algum patch antigo já chamou calcProntidaoEnamed.
export const calcProntidaoEnamed = calcPreparoEnamed;

export function getEnamedAction(intel) {
  const gargalo = intel?.gargalo;
  if (!gargalo) {
    return {
      title: "Sem dados ENAMED suficientes",
      detail: "Adicione temas e conclua revisões para gerar o mapa.",
      area: null,
    };
  }

  if (gargalo.retencao == null && gargalo.cobertura === 0) {
    return {
      title: `Comece por ${gargalo.area}`,
      detail: `Sem dados na área. Primeiro tópico sugerido: ${gargalo.hotTopics?.[0]?.subarea || "tema quente"}.`,
      area: gargalo.area,
    };
  }

  return {
    title: `Foque ${gargalo.area}`,
    detail: `Motivo: ${gargalo.motivo}. Cobertura ${gargalo.cobertura}%, retenção ${gargalo.retencao ?? "coletando"}.`,
    area: gargalo.area,
  };
}
```

---

## 7. PATCH 4 — Criar testes em `src/core/enamedIntel.test.js`

Crie:

```js
import {
  canonicalArea,
  getEnamedIntel,
  calcPreparoEnamed,
  topHotness,
  getEnamedAction,
} from "./enamedIntel";

const rev = (acerto) => ({ d0: { done: true, acerto } });

describe("enamedIntel", () => {
  test("normaliza áreas canônicas", () => {
    expect(canonicalArea("Cirurgia Geral")).toBe("Cirurgia");
    expect(canonicalArea("Ginecologia e Obstetrícia")).toBe("GO");
    expect(canonicalArea("Medicina de Família")).toBe("Preventiva");
    expect(canonicalArea("Clínica Médica")).toBe("Clínica Médica");
  });

  test("gera lista com 5 áreas e gargalo", () => {
    const temas = [
      { esp: "Clínica Médica", tema: "Cardiologia", unstarted: false, rev: rev(0.90) },
      { esp: "Cirurgia", tema: "Abdome agudo", unstarted: false, rev: rev(0.40) },
      { esp: "GO", tema: "Pré-natal", unstarted: true, rev: {} },
      { esp: "Pediatria", tema: "Puericultura", unstarted: true, rev: {} },
      { esp: "Preventiva", tema: "APS", unstarted: false, rev: rev(0.75) },
    ];

    const intel = getEnamedIntel(temas);
    expect(intel.lista).toHaveLength(5);
    expect(intel.gargalo).toBeTruthy();
    expect(intel.areas.Cirurgia.retencao).toBe(40);
    expect(intel.areas.Cirurgia.cobertura).toBe(100);
  });

  test("preparo ENAMED retorna null sem dados", () => {
    expect(calcPreparoEnamed([])).toBeNull();
  });

  test("preparo ENAMED retorna número quando há dados", () => {
    const temas = [
      { esp: "Clínica Médica", tema: "Cardiologia", unstarted: false, rev: rev(0.80) },
      { esp: "Preventiva", tema: "APS", unstarted: false, rev: rev(0.70) },
    ];
    const score = calcPreparoEnamed(temas);
    expect(typeof score).toBe("number");
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  test("topHotness retorna subtópicos ordenados", () => {
    const top = topHotness("Clínica Médica", 3);
    expect(top).toHaveLength(3);
    expect(top[0].peso).toBeGreaterThanOrEqual(top[1].peso);
  });

  test("gera ação interpretável", () => {
    const intel = getEnamedIntel([
      { esp: "Cirurgia", tema: "Apendicite", unstarted: false, rev: rev(0.50) },
    ]);
    const action = getEnamedAction(intel);
    expect(action.title).toMatch(/Foque|Comece/);
  });
});
```

---

## 8. PATCH 5 — Integrar em `src/core/readiness.js`

Adicione no topo:

```js
import { getEnamedIntel, calcPreparoEnamed } from "./enamedIntel";
```

Dentro de `getReadinessData`, depois de `targetProva` e `examData`, calcule:

```js
const enamedIntel = plat === "res" ? getEnamedIntel(temas) : null;
const preparoEnamed = plat === "res" ? calcPreparoEnamed(temas) : null;
```

No retorno final, adicione:

```js
enamedIntel,
preparoEnamed,
```

Não remova `priorityList` ainda. O Dashboard/Simulados/Mentor podem depender disso. O objetivo é adicionar um selector melhor, não quebrar compatibilidade.

Se houver conflito com Bloco A por renomeação de “preparo estimado”, preserve nomes internos e só ajuste rótulos visuais.

---

## 9. PATCH 6 — Criar `src/components/EnamedMapa.jsx`

Crie o componente abaixo. Ele deve funcionar dentro de Estatísticas e também como card compacto em Dashboard, se chamado com `compact`.

```jsx
// src/components/EnamedMapa.jsx
import React, { useMemo } from "react";
import { AlertTriangle, CheckCircle, Flame, Target, TrendingUp } from "lucide-react";
import { useStore } from "../core/store";
import { ESP_COLORS } from "../core/fsrs";
import { getEnamedAction, getEnamedIntel, calcPreparoEnamed } from "../core/enamedIntel";
import { InfoTooltip } from "./Primitives";

function statusClass(status) {
  if (status === "critica") return "border-red-500/25 bg-red-500/10 text-red-300";
  if (status === "atencao") return "border-amber-500/25 bg-amber-500/10 text-amber-300";
  if (status === "ok") return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
  return "border-white/10 bg-white/[0.03] text-gray-400";
}

function statusLabel(status) {
  if (status === "critica") return "crítico";
  if (status === "atencao") return "atenção";
  if (status === "ok") return "manter";
  return "coletando";
}

export default function EnamedMapa({ compact = false, onFocar }) {
  const plat = useStore((s) => s.plat);
  const temas = useStore((s) => s[plat]?.temas || []);

  const intel = useMemo(() => getEnamedIntel(temas), [temas]);
  const preparo = useMemo(() => calcPreparoEnamed(temas), [temas]);
  const action = useMemo(() => getEnamedAction(intel), [intel]);

  if (plat !== "res") return null;

  const handleFocar = () => {
    if (onFocar) onFocar(action.area || intel.gargalo?.area || null);
  };

  return (
    <section className="bg-[#111113] border border-white/5 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h3 className="text-[13px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Target size={15} className="text-blue-400" /> Mapa ENAMED
            <InfoTooltip texto="Mapa de preparo por macroárea RES. O gap combina peso da prova, cobertura e retenção para sugerir onde você tende a ganhar mais por hora de estudo." />
          </h3>
          <p className="text-[11px] text-gray-500 mt-1">
            Performance profunda: cobertura, retenção e tópicos quentes por área.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-right">
            <p className="text-[9px] uppercase font-black tracking-wider text-blue-300">Preparo ENAMED</p>
            <p className="text-xl font-black text-blue-100 tabular-nums">
              {preparo == null ? "coletando" : `${preparo}%`}
            </p>
          </div>
        </div>
      </div>

      {intel.gargalo && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle size={17} className="text-red-300 mt-0.5 shrink-0" />
            <div>
              <p className="text-[13px] font-bold text-red-100">{action.title}</p>
              <p className="text-[11px] text-red-100/70 mt-0.5">{action.detail}</p>
            </div>
          </div>
          {onFocar && (
            <button
              type="button"
              onClick={handleFocar}
              className="shrink-0 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] border-none cursor-pointer transition-colors"
            >
              Abrir cronograma
            </button>
          )}
        </div>
      )}

      <div className="space-y-2">
        {intel.lista.map((item) => {
          const color = ESP_COLORS[item.area] || "#60a5fa";
          return (
            <div key={item.area} className="rounded-xl border border-white/5 bg-black/25 p-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-[12px] font-black text-gray-100">{item.area}</span>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${statusClass(item.status)}`}>
                    {statusLabel(item.status)}
                  </span>
                </div>
                <span className="text-[10px] text-gray-500 tabular-nums">
                  gap {item.gap}%
                </span>
              </div>

              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${item.gap}%`, backgroundColor: color }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                <div className="rounded-lg bg-white/[0.03] p-2">
                  <p className="text-[9px] text-gray-500 uppercase font-bold">Cobertura</p>
                  <p className="text-[13px] font-black text-gray-100 tabular-nums">{item.cobertura}%</p>
                </div>
                <div className="rounded-lg bg-white/[0.03] p-2">
                  <p className="text-[9px] text-gray-500 uppercase font-bold">Retenção</p>
                  <p className="text-[13px] font-black text-gray-100 tabular-nums">{item.retencao == null ? "—" : `${item.retencao}%`}</p>
                </div>
                <div className="rounded-lg bg-white/[0.03] p-2">
                  <p className="text-[9px] text-gray-500 uppercase font-bold">Temas</p>
                  <p className="text-[13px] font-black text-gray-100 tabular-nums">{item.iniciados}/{item.total}</p>
                </div>
              </div>

              {!compact && (
                <div className="mt-3 space-y-1.5">
                  {item.hotTopicsPendentes?.length > 0 && (
                    <p className="text-[10.5px] text-gray-500 flex items-start gap-1.5 flex-wrap">
                      <Flame size={12} className="text-amber-400 mt-0.5 shrink-0" />
                      <span>
                        Próximos tópicos quentes: {item.hotTopicsPendentes.map((h) => `${h.subarea} (${h.pct}%)`).join(" · ")}
                      </span>
                    </p>
                  )}
                  {item.hotTopicsCobertos?.length > 0 && (
                    <p className="text-[10.5px] text-gray-600 flex items-start gap-1.5 flex-wrap">
                      <CheckCircle size={12} className="text-emerald-500 mt-0.5 shrink-0" />
                      <span>
                        Já cobertos: {item.hotTopicsCobertos.slice(0, 3).map((h) => h.subarea).join(" · ")}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!compact && (
        <div className="rounded-xl border border-white/5 bg-white/[0.025] p-3 flex items-start gap-2">
          <TrendingUp size={14} className="text-blue-400 mt-0.5 shrink-0" />
          <p className="text-[11px] text-gray-500 leading-relaxed">
            Leitura: o maior gap não significa “pior matéria” isoladamente. Ele indica maior retorno provável por hora estudada, combinando peso de prova, baixa cobertura e/ou baixa retenção.
          </p>
        </div>
      )}
    </section>
  );
}
```

---

## 10. PATCH 7 — Integrar no `StatsPanel.jsx`

No topo, adicione:

```js
import EnamedMapa from "./EnamedMapa";
```

Altere a assinatura para aceitar navegação:

```js
export default function StatsPanel({ setView }) {
```

Logo depois do bloco de KPIs ou antes dele, renderize o mapa quando `plat === "res"`:

```jsx
{plat === "res" && (
  <EnamedMapa
    onFocar={(area) => {
      if (setView) setView("crono");
    }}
  />
)}
```

Melhor localização: dentro do `<>...</>` que aparece quando `temas.length > 0`, antes de “KPIs”. Assim a primeira coisa da aba Estatísticas em residência vira uma decisão: **gargalo ENAMED**.

Também renomeie o KPI visual “Prontidão” para “Preparo estimado” se ele ainda existir nessa tela:

```js
label: "Preparo estimado",
```

Não altere `readinessTrend` ou `meta.prontidaoHist` neste bloco; é nome interno legado.

---

## 11. PATCH 8 — Ajustar `App.js` para passar `setView` ao StatsPanel

Em `src/App.js`, localize:

```jsx
<StatsPanel />
```

Troque por:

```jsx
<StatsPanel setView={setView} />
```

---

## 12. PATCH 9 — Integração leve no Dashboard, se Bloco A já estiver aplicado

Este patch é opcional e deve ser feito somente se for simples e não quebrar o Dashboard.

Em `Dashboard.jsx`, se já houver um bloco tipo “Performance reduzível”, “Resumo ENAMED” ou “Comando do Dia”, adicione um card compacto:

```js
import EnamedMapa from "./EnamedMapa";
```

E renderize:

```jsx
{plat === "res" && (
  <EnamedMapa compact onFocar={() => setView && setView("crono")} />
)}
```

Regra: no Dashboard, o mapa deve ser **compacto** e abaixo da ação principal. Não roubar o topo. Estatísticas é o lugar da versão completa.

Se a inserção for confusa por causa das mudanças do Bloco A, não force. Registre no relatório: “Mapa ENAMED completo integrado em Estatísticas; Dashboard será conectado no Bloco F”.

---

## 13. Verificações de qualidade

Rode:

```bash
npm run check:mojibake
npm test -- --watchAll=false
npm run build
```

Depois rode grep visual:

```bash
grep -R "Prontid" -n src/components src/core src/constants | head -80
grep -R "PRONTID" -n src/components src/core src/constants | head -80
grep -R "Ã\|Â\|�" -n src || true
```

Não é obrigatório eliminar todos os nomes internos antigos `prontidaoHist`/`scoreProntidao`; eles podem permanecer. O que não deve acontecer é novo rótulo visual “Prontidão” onde o usuário verá no dashboard/estatísticas.

---

## 14. Critérios de aceite

O bloco só está completo se:

- `src/core/enamedIntel.js` existe e exporta:
  - `AREAS_ENAMED`
  - `canonicalArea`
  - `matchArea`
  - `topHotness`
  - `getEnamedIntel`
  - `calcPreparoEnamed`
  - `calcProntidaoEnamed` como alias
  - `getEnamedAction`
- `src/core/enamedIntel.test.js` passa.
- `PROVA_STATS_RES.ENAMED` está atualizado para 2026/09/13 e com TRI/4º ano descritos.
- `store.js` usa `dataProva: "2026-09-13"` no default e reset.
- Persistidos com data velha `2026-10-25` migram para `2026-09-13`.
- `getReadinessData()` retorna `enamedIntel` e `preparoEnamed`.
- `StatsPanel` mostra `EnamedMapa` no topo quando `plat === "res"`.
- `App.js` passa `setView` para `StatsPanel`.
- `npm run check:mojibake`, testes e build passam ou, se houver falha pré-existente, ela é documentada com causa.

---

## 15. Relatório final esperado do agente

Ao terminar, responda com:

```txt
BLOCO B concluído.

Arquivos alterados:
- ...

O que foi implementado:
- Mapa ENAMED acionável em Estatísticas.
- Selector puro enamedIntel.
- Preparo ENAMED estimado.
- Gargalo por gap: peso da prova + cobertura + retenção.
- Hot topics pendentes/cobertos.
- Atualização da data ENAMED 2026 para 13/09/2026.

Validações:
- npm run check:mojibake: OK/FALHOU (...)
- npm test -- --watchAll=false: OK/FALHOU (...)
- npm run build: OK/FALHOU (...)

Riscos/observações:
- ...

Próximo bloco recomendado:
- Bloco C: Motor Illness Script puro em src/core/illnessScript.js.
```

Não faça commit, deploy ou push.
