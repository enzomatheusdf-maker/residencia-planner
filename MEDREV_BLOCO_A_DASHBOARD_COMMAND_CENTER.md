# MEDREV — BLOCO A: Dashboard Command Center, Preparo Estimado e Academia na Sidebar

> **Use este bloco sozinho no Claude Code / VSCodex.**
> Objetivo: transformar o Dashboard em um **Comando do Dia**, reduzir ruído de performance no painel principal, renomear “Prontidão” para uma métrica mais honesta, manter True Retention como status “coletando”, preparar slots para ENAMED/Raciocínio Clínico sem implementar esses motores ainda, e colocar **Academia** na barra lateral.

---

## Modelo recomendado

- **Modelo:** Claude Sonnet
- **Esforço:** alto
- **Por quê:** envolve UI, copy, fluxo de decisão, métricas e navegação. É mais sensível do que o Bloco 0 porque mexe na primeira tela do usuário, mas ainda não deve mexer pesado no core.

---

## Decisões de produto já aprovadas

1. O Dashboard deve ser **Comando do Dia**, não painel completo de performance.
2. A parte do **Mentor** deve ficar em aba/seção reduzível.
3. A performance profunda deve ser empurrada para **Estatísticas**.
4. “Prontidão” deve mudar de nome. Use **Preparo estimado**.
5. `True Retention` sem dados deve aparecer como **coletando**, mas não deve ocupar o lugar de métrica principal independente.
6. No mobile, use layout compacto; no desktop, hero maior + cards menores.
7. Raciocínio Clínico entra como **CTA/slot**, não como integração profunda neste bloco.
8. Se a fila estiver zerada, o próximo empurrão deve ser tema novo/alta incidência; se houver revisão, revisão vem primeiro.
9. A aba **Academia** deve aparecer na barra lateral e funcionar no mobile também.

---

## Inspiração técnica e educacional

- Dashboards de aprendizagem funcionam melhor quando reduzem custo de inferência: indicador precisa de contexto, referência e ação.
- Em revisão espaçada/FSRS, `True Retention` só fica interpretável depois de dados suficientes; dado diário é ruidoso. Portanto, quando ainda não houver D21+, o app deve dizer “coletando”, não fingir precisão.
- Plataformas como AMBOSS/UWorld usam performance para sugerir próximos tópicos/práticas; o Dashboard deve fazer isso no topo, e deixar análise detalhada para Estatísticas.

---

## Comando para colar no Claude Code

```bash
claude --model sonnet --permission-mode acceptEdits <<'PROMPT'
Você é engenheiro sênior de frontend, programador React, pesquisador em ciência da aprendizagem e especialista em produto educacional para residência médica.

Contexto:
- App React CRA + Zustand + Tailwind + Firebase.
- O projeto tem histórico de mojibake/encoding. Não introduza regressão.
- Este bloco mexe principalmente em Dashboard e navegação.
- Não implemente ainda o motor ENAMED completo.
- Não implemente ainda o motor de Illness Script.
- Não reescreva o app inteiro.

Regras inegociáveis:
1. UTF-8 sem BOM.
2. Não introduza mojibake.
3. Não adicione dependências novas.
4. Não mude stack.
5. Use `lucide-react` para ícones em UI crítica; não crie novos emojis hardcoded em KPIs/badges/botões.
6. Não renomeie chaves persistidas como `meta.prontidaoHist` neste bloco; isso causaria migração desnecessária.
7. User-facing copy muda para “Preparo estimado”; nomes internos podem continuar como `readiness`, `prontidao`, `prontidaoHist` para reduzir risco.
8. Não faça deploy nem push neste bloco.
9. Rode validação no final.

# BLOCO A — DASHBOARD COMMAND CENTER

## A.0 Ler arquivos antes de editar

Leia estes arquivos antes de modificar:

```bash
sed -n '1,260p' src/components/Sidebar.jsx
sed -n '1,220p' src/components/BottomNav.jsx
sed -n '1,260p' src/App.js
sed -n '1,260p' src/core/readiness.js
sed -n '1,220p' src/core/volume.js
sed -n '1,260p' src/hooks/useMetrics.js
sed -n '1,260p' src/core/mentor.js
```

Depois localize as zonas relevantes do Dashboard:

```bash
grep -n "export default function Dashboard\|Camada primaria\|KPIs\|Prontid\|True Retention\|Diagnóstico do Mentor\|showCompleto\|showDetailedPanels\|DicaContextual\|TrilhaJornada\|exportarCartao" src/components/Dashboard.jsx
```

Critério: entenda a estrutura atual antes de editar. O Dashboard já tem lógica útil; o trabalho é reorganizar e tornar a interpretação honesta.

---

## A.1 Adicionar Academia na sidebar

Arquivo: `src/components/Sidebar.jsx`

Tarefa:
1. Adicione um ícone adequado de `lucide-react`, preferencialmente `GraduationCap` ou `BookOpenCheck` se disponível na versão instalada.
2. Inclua a aba `Academia` no array `NAV`.
3. Posição recomendada: logo após `Cronograma`, porque a Academia explica o método.

Patch esperado, ajustando ao import existente:

```jsx
import {
  LayoutDashboard, Calendar, BarChart3, FileText, Target, Zap,
  ChevronRight, Info, Settings, LogOut, Flame, Stethoscope,
  GraduationCap
} from "lucide-react";
```

E no `NAV`:

```jsx
export const NAV = [
  { k: "dash",  icon: LayoutDashboard, label: "Dashboard"     },
  { k: "crono", icon: Calendar,        label: "Cronograma"     },
  { k: "academia", icon: GraduationCap, label: "Academia"      },
  { k: "banco", icon: BarChart3,       label: "Banco de Dados" },
  { k: "stats", icon: FileText,        label: "Estatísticas"   },
  { k: "sims",  icon: Target,          label: "Simulados"      },
  { k: "anki",  icon: Zap,             label: "Anki Audit"     },
  { k: "raciocinio", icon: Stethoscope, label: "Raciocínio", requiresModule: "raciocinioClinico" }
];
```

Arquivo: `src/components/BottomNav.jsx`

- Verifique se `primaryKeys` já contém `academia`.
- Se não contiver, adicione.
- Se já contiver, não mexa.

Arquivo: `src/App.js`

- Confirme que `view === "academia"` renderiza `<AcademiaMetodo />`.
- Se já existir, não mexa.

Validação rápida:

```bash
grep -RIn "k: \"academia\"\|view === \"academia\"\|primaryKeys" src/components/Sidebar.jsx src/components/BottomNav.jsx src/App.js
```

---

## A.2 Renomear “Prontidão” para “Preparo estimado” no Dashboard

Arquivo principal: `src/components/Dashboard.jsx`

Tarefa:
- Troque a copy user-facing:
  - `Prontidão` / `Prontidao` / `ÍNDICE DE PRONTIDÃO GERAL` / `Cartão de Prontidão`
  - por:
  - `Preparo estimado` / `ÍNDICE DE PREPARO ESTIMADO` / `Cartão de preparo`

Importante:
- Não precisa renomear variáveis internas como `prontidao`, `readinessTrend`, `meta.prontidaoHist`, `exportarCartaoProntidao` se isso gerar diff grande.
- Mas strings visíveis ao usuário devem mudar.
- A explicação deve deixar claro que é uma **estimativa**, não uma verdade absoluta.

Trocas obrigatórias:

```txt
ÍNDICE DE PRONTIDÃO GERAL -> ÍNDICE DE PREPARO ESTIMADO
ÍNDICE DE PRONTIDÒO GERAL -> ÍNDICE DE PREPARO ESTIMADO
Cartão de Prontidão -> Cartão de preparo
Compartilhar Cartao de Prontidao -> Compartilhar cartão de preparo
Prontidao -> Preparo estimado
Prontidão -> Preparo estimado
Score de Prontidão -> Preparo estimado
```

Novo tooltip recomendado para o card:

```txt
Estimativa composta por cobertura, simulados, ritmo, Anki e retenção longa quando disponível. Enquanto faltarem dados D21+, trate como direção de estudo, não como previsão final.
```

Novo texto no canvas/export:

```txt
ÍNDICE DE PREPARO ESTIMADO
```

Novo toast:

```txt
Cartão de preparo exportado com sucesso.
```

Evite emoji no toast novo.

---

## A.3 Adicionar confiabilidade/calibração ao Preparo estimado

Motivo: o score atual ignora componentes `null` e reescala pesos. Isso é aceitável como cálculo, mas perigoso visualmente: pode parecer precisão alta com pouca evidência.

Crie um helper local em `src/components/Dashboard.jsx`, perto de outros helpers/componentes pequenos, sem exportar:

```jsx
function getPreparoCalibration({ readinessData, trueRet, totalSessions, temasFiltrados, totalRevisoesFeitas }) {
  const startedCount = (temasFiltrados || []).filter((t) => !t.unstarted).length;
  const hasCoverage = (readinessData?.cobertura || 0) > 0 && startedCount >= 3;
  const hasSimulado = readinessData?.acertoSimulado != null;
  const hasRetencaoLonga = trueRet != null || readinessData?.trueRetention != null;
  const hasRitmo = readinessData?.saldoRitmoNorm != null;
  const hasAnki = readinessData?.adesaoAnkiNorm != null;

  const evidencias = [hasCoverage, hasSimulado, hasRetencaoLonga, hasRitmo, hasAnki].filter(Boolean).length;

  let nivel = "baixa";
  let tone = "text-amber-300 border-amber-500/20 bg-amber-500/10";
  let label = "Estimativa inicial";

  if (evidencias >= 4 && totalSessions >= 30 && totalRevisoesFeitas >= 30) {
    nivel = "alta";
    tone = "text-emerald-300 border-emerald-500/20 bg-emerald-500/10";
    label = "Estimativa calibrada";
  } else if (evidencias >= 2 && totalSessions >= 7) {
    nivel = "media";
    tone = "text-blue-300 border-blue-500/20 bg-blue-500/10";
    label = "Estimativa em calibração";
  }

  const missing = [];
  if (!hasRetencaoLonga) missing.push("retenção longa D21+");
  if (!hasSimulado) missing.push("simulados");
  if (!hasRitmo) missing.push("ritmo de questões");
  if (!hasAnki) missing.push("adesão Anki");

  return {
    nivel,
    tone,
    label,
    evidencias,
    missing,
    trueRetentionStatus: hasRetencaoLonga ? "ativa" : "coletando",
  };
}
```

Depois, dentro do componente `Dashboard`, crie:

```jsx
const preparoCalibration = useMemo(() => {
  return getPreparoCalibration({
    readinessData,
    trueRet,
    totalSessions,
    temasFiltrados,
    totalRevisoesFeitas,
  });
}, [readinessData, trueRet, totalSessions, temasFiltrados, totalRevisoesFeitas]);
```

Use `preparoCalibration` no card de Preparo estimado.

Copy visual obrigatória:
- Mostrar badge: `Estimativa inicial`, `Estimativa em calibração` ou `Estimativa calibrada`.
- Mostrar sublinha se `True Retention` estiver ausente:

```txt
Retenção longa: coletando D21+
```

Não use a palavra “pronto” como promessa.

---

## A.4 Transformar o topo em “Comando do dia”

O topo deve responder uma pergunta:

```txt
O que faço agora?
```

Substitua a intenção do hero principal para:

- Eyebrow: `Comando do dia`
- Título dinâmico curto.
- Explicação em uma frase.
- CTA primário.
- CTA secundário para Estatísticas.
- Ring de progresso diário continua, mas sem competir com o CTA.

Crie um `useMemo` para a mensagem do comando do dia:

```jsx
const comandoDoDia = useMemo(() => {
  if (hasExhaustionNow) {
    return {
      eyebrow: "Comando do dia",
      title: "Proteja o sistema antes de acelerar",
      subtitle: "Seu padrão recente sugere fadiga ou queda de qualidade. Faça revisão leve ou reduza a carga hoje.",
      primaryLabel: pending > 0 ? "Fazer revisão leve" : "Abrir cronograma",
      secondaryLabel: "Ver estatísticas",
      tone: "amber",
    };
  }

  if (overdue.length > 0 && topFilaItem) {
    return {
      eyebrow: "Comando do dia",
      title: `Recuperar revisão vencida: ${topFilaItem.temaNome}`,
      subtitle: naReserva > 0
        ? `${pending} revisões na fila de hoje e ${naReserva} na reserva. Comece pela revisão mais crítica.`
        : `${pending} revisões na fila de hoje. Comece pela revisão mais crítica.`,
      primaryLabel: "Iniciar revisão crítica",
      secondaryLabel: "Ver estatísticas",
      tone: "red",
    };
  }

  if (topFilaItem?.isOptimal) {
    return {
      eyebrow: "Comando do dia",
      title: `Janela ideal: ${topFilaItem.temaNome}`,
      subtitle: "Este item está próximo do ponto ótimo de recuperação. É o melhor custo-benefício cognitivo agora.",
      primaryLabel: "Iniciar no ponto ideal",
      secondaryLabel: "Ver estatísticas",
      tone: "blue",
    };
  }

  if (pending > 0 && topFilaItem) {
    return {
      eyebrow: "Comando do dia",
      title: `Comece por: ${topFilaItem.temaNome}`,
      subtitle: naReserva > 0
        ? `${pending} revisões programadas hoje e ${naReserva} fora do teto diário.`
        : "A fila já está ordenada por urgência, peso e custo cognitivo.",
      primaryLabel: "Iniciar foco",
      secondaryLabel: "Ver estatísticas",
      tone: "blue",
    };
  }

  const gargalo = readinessData?.priorityList?.[0];
  return {
    eyebrow: "Comando do dia",
    title: gargalo?.area ? `Fila zerada. Avance em ${gargalo.area}.` : "Fila zerada. Avance sem pressa.",
    subtitle: gargalo?.area
      ? "Sem revisões pendentes. Use o tempo para iniciar um tema de alta incidência ou baixa cobertura."
      : "Sua curva está protegida hoje. Você pode iniciar tema novo ou descansar sem culpa.",
    primaryLabel: gargalo?.area ? "Escolher tema prioritário" : "Abrir cronograma",
    secondaryLabel: "Ver estatísticas",
    tone: "emerald",
  };
}, [hasExhaustionNow, overdue.length, topFilaItem, pending, naReserva, readinessData?.priorityList]);
```

Use esse objeto no hero.

CTA primário:

```jsx
onClick={() => {
  if (pending > 0 && topFilaItem) onStudy(topFilaItem.temaId, topFilaItem.stepKey);
  else setView && setView("crono");
}}
```

CTA secundário:

```jsx
onClick={() => setView && setView("stats")}
```

Regra de produto:
- Se houver revisão pendente, o Dashboard empurra revisão.
- Se a fila estiver zerada, o Dashboard empurra cronograma/tema prioritário.
- Não empurre simulado ou raciocínio clínico como ação principal neste bloco.

---

## A.5 Reduzir KPIs principais para cards acionáveis

O topo não deve ter 5 métricas competindo. Troque a seção de KPIs por 4 cards principais:

1. `Fila de hoje`
   - Valor: pendentes + reserva.
   - Subtexto: `dentro do teto diário` ou `+N na reserva`.

2. `Preparo estimado`
   - Valor: `${readinessCountUp}%`.
   - Badge: `preparoCalibration.label`.
   - Subtexto:
     - se `trueRet == null`: `Retenção longa: coletando D21+`.
     - se `trueRet != null`: `Retenção longa: ${trueRet}%`.
   - Botão share continua, mas copy deve ser “cartão de preparo”.

3. `Qualidade recente`
   - Valor: acerto médio se existir; senão `coletando`.
   - Subtexto: `baseado em questões/revisões concluídas`.

4. `Consistência`
   - Valor: `${streakCurrent}/7` ou dias ativos na última semana.
   - Subtexto: `dias ativos nos últimos 7 dias`.

`True Retention`:
- Não deixe como card premium independente no topo.
- Preserve como status dentro do card `Preparo estimado`, com `coletando` quando `null`.
- Se já houver dados, mostrar o percentual no subtexto do card.

Critério: depois da mudança, o usuário entende “o que fazer hoje” e “quão confiável é a estimativa”, sem ficar confuso com `100%` vs `0 dominados`.

---

## A.6 Mini-faixa ENAMED sem implementar o Bloco B

Ainda não crie `enamedIntel.js`. Use apenas `readinessData.priorityList`, que já existe.

Adicionar logo abaixo dos KPIs ou ao lado dos slots:

- Título: `Gargalo provável ENAMED`
- Se houver `readinessData.priorityList?.[0]`:
  - área
  - cobertura
  - acerto/retention se existir, senão `coletando`
  - CTA `Ver mapa em Estatísticas` -> `setView("stats")`
- Se não houver dados:
  - `Coletando dados por área. Complete revisões/simulados para gerar prioridade.`

Exemplo de copy:

```txt
Gargalo provável ENAMED
Clínica Médica · cobertura 38% · desempenho coletando
```

Não implementar mapa completo agora. Isso é Bloco B.

---

## A.7 Slot de Raciocínio Clínico sem implementar Illness Script ainda

Adicionar card/slot discreto no Dashboard:

Se `meta.modulos?.raciocinioClinico === true`:

```txt
Raciocínio clínico
Casos clínicos: coletando
Treinar caso
```

CTA:

```jsx
onClick={() => setView && setView("raciocinio")}
```

Se módulo estiver desligado:

```txt
Raciocínio clínico opcional
Ative o treino por casos para complementar revisão e questões.
Ativar em ajustes
```

CTA:

```jsx
onClick={onOpenAjustes}
```

Regra:
- Não calcular score de raciocínio neste bloco.
- Não criar banco de casos neste bloco.
- Não alterar `store.js` neste bloco.

---

## A.8 Mentor e performance como seção reduzível

A parte do Mentor e as análises mais profundas devem ficar atrás de uma seção reduzível.

Preservar:
- Alertas críticos (`criticalAlerts`) devem continuar aparecendo fora da seção reduzida, porque são segurança/comportamento.
- Banner de pausa/férias deve continuar visível.
- Dica de sobrecarga FSRS deve continuar visível, mas pode ficar abaixo do hero/KPIs.

Reduzir:
- Diagnóstico completo do Mentor.
- Zonas de alerta detalhadas.
- Gráficos/metacognição.
- Cards de performance secundária.
- `DicaContextual`/`TrilhaJornada`, se poluírem o comando do dia.

Trocar o botão atual:

```txt
Ver diagnóstico completo
```

por algo mais honesto:

```txt
Mentor e análise detalhada
```

Subtexto próximo ao botão:

```txt
Use esta seção para reflexão semanal. A análise completa fica em Estatísticas.
```

Adicionar CTA para Estatísticas dentro da seção:

```jsx
<button onClick={() => setView && setView("stats")}>Abrir Estatísticas</button>
```

Regra:
- No `modoSimples`, a seção começa fechada.
- Fora de `modoSimples`, pode aparecer aberta como hoje, mas sem dominar o topo.
- Não delete lógica útil; reorganize.

---

## A.9 Melhorar Carga Futura sem virar painel de performance

O widget `CargaFuturaWidget` já existe. Melhore levemente:

1. Mostrar quantos dias ultrapassam o teto:

```jsx
const diasSobrecarga = Object.values(proj).filter((count) => count > maxRevisoesDia).length;
```

2. No header, mostrar:

```txt
Teto: X/dia · Y dias acima do teto
```

3. Se `diasSobrecarga >= 3`, mostrar uma frase de ação:

```txt
Ação: não iniciar tema novo até reduzir a sobrecarga.
```

Ou, se `diasSobrecarga === 0`:

```txt
Carga controlada para os próximos 14 dias.
```

Não crie gráfico novo. Só torne o widget mais interpretável.

---

## A.10 Ajustes de copy e encoding

Faça uma varredura no Dashboard após editar:

```bash
grep -RIn "Prontid\|prontid\|PRONTID\|PRONTIDÒO" src/components/Dashboard.jsx src/components/Sidebar.jsx src/components/BottomNav.jsx src/App.js || true
```

Aceitável:
- Variáveis internas como `prontidao`, `prontidaoHist`, `exportarCartaoProntidao`.

Não aceitável:
- Texto visível ao usuário dizendo `Prontidão`/`Prontidao` no Dashboard.
- `PRONTIDÒO` em qualquer lugar.

Não introduza novos emojis em labels de KPI, badges e botões. Ícones devem vir de `lucide-react`.

---

## A.11 Validação obrigatória

Execute:

```bash
git diff -- src/components/Dashboard.jsx src/components/Sidebar.jsx src/components/BottomNav.jsx src/App.js
npm run check:mojibake
npm test -- --watchAll=false --passWithNoTests
npm run build
```

Se `npm test` falhar por testes pré-existentes não relacionados ao diff, registre claramente. Não esconda falha.

Se `npm run check:mojibake` falhar:
- Corrija antes de finalizar.
- Não avance com build se houver mojibake real em `src/`.

---

## A.12 Critérios de aceite

Marque cada item no relatório final:

- [ ] Dashboard agora comunica **Comando do dia** no topo.
- [ ] CTA principal respeita a regra: revisão pendente > tema novo.
- [ ] “Prontidão” foi trocado por **Preparo estimado** nas strings visíveis do Dashboard.
- [ ] O score mostra nível de confiança/calibração.
- [ ] `True Retention` aparece como **coletando D21+** quando ainda não há dados.
- [ ] `True Retention` não compete como KPI premium independente no topo.
- [ ] Performance profunda foi reduzida no Dashboard e direcionada para Estatísticas.
- [ ] Mentor completo está em seção reduzível.
- [ ] Alertas críticos continuam visíveis fora da seção reduzida.
- [ ] Mini-faixa ENAMED usa `readinessData.priorityList` sem criar core novo.
- [ ] Slot de Raciocínio Clínico aparece como CTA/estado “coletando”, sem implementar Illness Script ainda.
- [ ] Academia aparece na Sidebar desktop.
- [ ] Academia aparece no BottomNav/mobile ou no menu “Mais”.
- [ ] `npm run check:mojibake` passou.
- [ ] `npm run build` passou.

---

## A.13 Não fazer neste bloco

Não faça:

- Não criar `src/core/enamedIntel.js` ainda.
- Não criar `src/core/illnessScript.js` ainda.
- Não reescrever `RaciocinioClinico.jsx` ainda.
- Não reescrever `StatsPanel.jsx` ainda, exceto se for ajuste mínimo de navegação inevitável.
- Não mudar fórmula de `scoreProntidao` em `src/core/volume.js` neste bloco.
- Não migrar `meta.prontidaoHist`.
- Não adicionar Recharts, D3 ou outra lib.
- Não fazer deploy.
- Não fazer push.

---

## Relatório final esperado do Claude

Ao terminar, responda com:

1. Arquivos modificados.
2. Resumo das mudanças de produto.
3. Resultado dos comandos:
   - `npm run check:mojibake`
   - `npm test -- --watchAll=false --passWithNoTests`
   - `npm run build`
4. Se houve falha, explicar exatamente onde e por quê.
5. Informar se fez commit local. Não fazer push.

PROMPT
```

---

## Nota para revisão humana antes de rodar

Este bloco é deliberadamente limitado: ele melhora a tela principal e a navegação, mas não resolve ainda ENAMED profundo nem Illness Script. Isso evita que o executor misture UI, core, casos clínicos e store persistido no mesmo diff.

Depois que este bloco passar, o próximo bloco ideal é:

- **Bloco B:** `enamedIntel.js` + StatsPanel/Mapa ENAMED.
- Depois: **Bloco C/D/E:** motor Illness Script, banco de casos e UI de raciocínio clínico.
